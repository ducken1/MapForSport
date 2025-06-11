# Uporabimo Node.js uradno sliko kot osnovo
FROM node:16

# Nastavimo delovno mapo
WORKDIR /usr/src/app

# Kopiramo package.json in package-lock.json
COPY package*.json ./

# Namestimo odvisnosti
RUN npm install

# Kopiramo preostale datoteke v sliko
COPY . .

# Izvozimo vrata za strežnik
EXPOSE 50051

# Zaženemo aplikacijo
CMD ["node", "server.js"]
