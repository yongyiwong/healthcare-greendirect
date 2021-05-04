FROM mdillon/postgis

ENV PG_MAJOR=10.4 \
  POSTGIS_MAJOR=2.4 \
  POSTGIS_VERSION=2.4.4 \
  POSTGRES_DB=greendirect \
  POSTGRES_USER=root \
  POSTGRES_PASSWORD=l0c4lp4ss
COPY greendirect-schema.sql /docker-entrypoint-initdb.d/

EXPOSE 5432
