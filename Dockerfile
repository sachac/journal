FROM node:current-bookworm
RUN addgroup www && adduser www --ingroup www
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# install and cache app dependencies
COPY package.json /app/package.json
COPY yarn.lock /app/yarn.lock
COPY .yarnrc.yml /app/.yarnrc.yml
RUN corepack enable
RUN yarn install
RUN yarn global add react-scripts@5.0.1 nodemon
COPY src/server.js src/data.js /app/src/
COPY build /app/build
USER www
# start app
CMD ["yarn", "run", "server"]
