FROM node:alpine

MAINTAINER Popov Genenadiy <me@westtrade.tk>

WORKDIR /var/www
RUN npm i gil -g
CMD gil 
