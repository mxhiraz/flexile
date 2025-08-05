FROM ubuntu:22.04

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    libssl-dev \
    libffi-dev \
    libreadline-dev \
    zlib1g-dev \
    libyaml-dev \
    libsqlite3-dev \
    sqlite3 \
    libxml2-dev \
    libxslt1-dev \
    libcurl4-openssl-dev \
    software-properties-common \
    libpq-dev \
    postgresql-client \
    redis-tools \
    docker.io \
    docker-compose \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs

# Install pnpm
RUN npm install -g pnpm

# Install Ruby via rbenv
RUN git clone https://github.com/rbenv/rbenv.git ~/.rbenv \
    && echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.bashrc \
    && echo 'eval "$(rbenv init -)"' >> ~/.bashrc \
    && git clone https://github.com/rbenv/ruby-build.git ~/.rbenv/plugins/ruby-build

# Set environment for rbenv
ENV PATH="/root/.rbenv/bin:/root/.rbenv/shims:$PATH"

# Install Ruby (using version from .ruby-version)
RUN rbenv install 3.4.3 && rbenv global 3.4.3

# Install bundler
RUN gem install bundler

# Set working directory
WORKDIR /app

# Copy package files for caching
COPY package.json pnpm-lock.yaml ./
COPY frontend/package.json frontend/pnpm-lock.yaml ./frontend/
COPY backend/Gemfile backend/Gemfile.lock ./backend/

# Install dependencies
RUN pnpm install
RUN cd backend && bundle install

# Copy the rest of the application
COPY . .

# Make scripts executable
RUN chmod +x .buildkite/scripts/*.sh

CMD ["bash"]