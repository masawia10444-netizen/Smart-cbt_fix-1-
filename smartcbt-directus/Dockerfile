ARG DOCKER_DIRECTUS_VERSION=10.6.3

FROM directus/directus:${DOCKER_DIRECTUS_VERSION}

USER root

# Install build tools for native modules (argon2, etc.)
RUN apk add --no-cache python3 make g++ git

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@8.5.1 --activate

USER node

# FIX: Previous version deleted node_modules which broke native binaries (argon2)
# Original code (commented out for history):
# RUN rm -rf node_modules
# RUN pnpm install --shamefully-hoist

# CRITICAL: Use --shamefully-hoist to create a flat node_modules structure.
# Directus and its native modules (like argon2) expect this layout to find their binaries.
RUN pnpm add --shamefully-hoist \
    moment uuid \
    @bicou/directus-extension-tiptap \
    directus-extension-computed-interface \
    directus-extension-schema-management-module \
    directus-extension-field-actions \
    directus-extension-api-docs \
    directus-extension-editorjs \
    directus-extension-tags-m2m-interface \
    directus-extension-grid-layout \
    directus-extension-comment-interface \
    directus-extension-currency-interface \
    directus-extension-masked-interface \
    directus-extension-svgmap-picker-interface \
    directus-extension-display-link \
    directus-extension-m2o-presentation-interface \
    directus-extension-group-tabs-interface
