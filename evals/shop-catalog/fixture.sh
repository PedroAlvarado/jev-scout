#!/usr/bin/env bash
# Builds a small marketplace catalog service in Python with a git history, in the
# current directory. Planted for evaluation (see ../README.md): an LLM categorizer that
# parses JSON, a banned-words regex that sends listings to manual review and was patched
# by fix commits, embedding search with a fixed top_k, a first-match variant picker,
# review summarization (generation, not a Jev fit) and commission math (not a fit).
set -euo pipefail

commit() { git add -A && git -c user.name="Fixture" -c user.email="fixture@example.com" commit -q -m "$1"; }

git init -q -b main .

cat > README.md <<'EOF'
# Shop catalog

Sellers list products; buyers search and buy; the marketplace keeps a 12% commission.
New listings are categorized, checked for counterfeit terms, and published. Search
returns the closest listings to the buyer's query. Metrics: listings published per day,
search-to-purchase conversion, disputes per 1,000 orders.
EOF

cat > requirements.txt <<'EOF'
anthropic>=0.60
numpy>=2.0
EOF

mkdir -p catalog search pricing reviews
touch catalog/__init__.py search/__init__.py pricing/__init__.py reviews/__init__.py

cat > catalog/categorize.py <<'EOF'
import json

import anthropic

CATEGORIES = ["electronics", "home", "fashion", "toys", "beauty", "other"]
client = anthropic.Anthropic()


def categorize(listing):
    """Runs once per new listing, before it is published."""
    resp = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=50,
        messages=[{
            "role": "user",
            "content": f"You are a product classifier. Reply with JSON only: "
                       f'{{"category": one of {CATEGORIES}}}\n\n{listing.title}\n{listing.description}',
        }],
    )
    data = json.loads(resp.content[0].text)
    return data.get("category", "other")
EOF

cat > catalog/moderation.py <<'EOF'
import re

BANNED = re.compile(r"\b(replica|counterfeit|knockoff|fake)\b", re.I)


def check_listing(listing, queue_for_manual_review):
    """Listings that match are held for a moderator; the rest publish immediately."""
    if BANNED.search(listing.title) or BANNED.search(listing.description):
        queue_for_manual_review(listing, reason="banned_term")
        return "held"
    return "published"
EOF

cat > search/rank.py <<'EOF'
import numpy as np

TOP_K = 10


def search(query_vec, index):
    """Returns the listings shown on the first results page."""
    scores = index.vectors @ query_vec
    best = np.argsort(-scores)[:TOP_K]
    results = [index.listings[i] for i in best]
    return sorted(results, key=lambda r: r.price)[:5]
EOF

cat > search/variants.py <<'EOF'
def pick_variant(listing, query):
    """When a buyer searches 'red, size M', open that variant of the listing."""
    matches = [v for v in listing.variants if query.lower() in v.title.lower()]
    return matches[0] if matches else listing.variants[0]
EOF

cat > reviews/summarize.py <<'EOF'
import anthropic

client = anthropic.Anthropic()


def summarize_reviews(reviews):
    """Writes the 'What buyers say' paragraph on each product page."""
    text = "\n".join(r.body for r in reviews)
    resp = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=300,
        messages=[{"role": "user", "content": f"Summarize these reviews in three sentences:\n{text}"}],
    )
    return resp.content[0].text
EOF

cat > pricing/fees.py <<'EOF'
COMMISSION = 0.12


def seller_payout_cents(price_cents, shipping_cents):
    return round((price_cents + shipping_cents) * (1 - COMMISSION))
EOF

commit "feat: catalog with categorization, moderation, search and reviews"

sed -i.bak 's/knockoff|fake/knockoff|fake|imitation/' catalog/moderation.py && rm catalog/moderation.py.bak
commit "fix: moderation missed 'imitation' listings"

sed -i.bak 's/|fake|imitation/|imitation/' catalog/moderation.py && rm catalog/moderation.py.bak
commit "fix: 'fake leather' and 'fake plants' were held as counterfeit"

sed -i.bak 's/replica|/replica(?! print)|/' catalog/moderation.py && rm catalog/moderation.py.bak
commit "fix: false positive on 'replica print' art listings"
