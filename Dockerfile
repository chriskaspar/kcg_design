# FROM node:20-slim

# WORKDIR /app

# ENV NODE_ENV=production
# ENV PIPELINE_UI_HOST=0.0.0.0
# ENV PIPELINE_UI_PORT=8080

# COPY package*.json ./
# RUN npm ci --omit=dev

# # COPY scripts ./scripts
# # COPY ui ./ui
# # COPY data ./data

# EXPOSE 8080

# CMD ["npm", "run", "ui:start"]
