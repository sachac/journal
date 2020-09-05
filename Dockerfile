FROM node:12.2.0-alpine
RUN addgroup -S www && adduser -S www -G www
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# install and cache app dependencies
COPY package.json /app/package.json
COPY yarn.lock /app/yarn.lock
RUN yarn install 
RUN yarn global add react-scripts@3.4.3 nodemon
COPY src/server.js src/data.js /app/src/
COPY build /app/build
USER www
# start app
CMD ["yarn", "run", "server"]
