#!/bin/bash
set -euo pipefail

echo "--- Running RSpec tests"

# Run common setup
.buildkite/scripts/setup.sh

echo "--- Setting up test database"
cd backend
bundle exec rails db:create db:schema:load

echo "--- Running RSpec tests with Knapsack Pro"
export KNAPSACK_PRO_CI_NODE_TOTAL=${CI_NODE_TOTAL:-2}
export KNAPSACK_PRO_CI_NODE_INDEX=${CI_NODE_INDEX:-0}

bundle exec rake "knapsack_pro:queue:rspec[--format RSpec::Github::Formatter --tag ~skip --tag ~type:system --format progress]"

echo "✅ RSpec tests complete"