FROM ruby:3.1

WORKDIR /app

# Instalar dependencias necesarias
RUN apt-get update && apt-get install -y \
    build-essential \
    nodejs

# Instalar Jekyll y Bundler
RUN gem install bundler

# Copiar Gemfile (si existe)
COPY Gemfile* ./

# Instalar gemas si existe Gemfile
RUN if [ -f Gemfile ]; then bundle install; fi

# Exponer puerto 4000
EXPOSE 4000

# Comando para ejecutar Jekyll en modo desarrollo
CMD ["bundle", "exec", "jekyll", "serve", "--force_polling", "--host", "0.0.0.0"]