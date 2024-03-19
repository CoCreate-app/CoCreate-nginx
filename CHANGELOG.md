## [1.3.3](https://github.com/CoCreate-app/CoCreate-nginx/compare/v1.3.2...v1.3.3) (2024-03-19)


### Bug Fixes

* replaced keyword spaces with hyphens and lowercase letters only ([7d6fd9c](https://github.com/CoCreate-app/CoCreate-nginx/commit/7d6fd9cb5846cfe8fe167c30b3accf323ba494f4))

## [1.3.2](https://github.com/CoCreate-app/CoCreate-nginx/compare/v1.3.1...v1.3.2) (2024-03-18)


### Bug Fixes

* description ([1f9c2d6](https://github.com/CoCreate-app/CoCreate-nginx/commit/1f9c2d6f8433742831fc931ad02b3aa9695673e1))

## [1.3.1](https://github.com/CoCreate-app/CoCreate-nginx/compare/v1.3.0...v1.3.1) (2024-02-05)


### Bug Fixes

* Removed https://cdn.cocreate.app/latest/CoCreate.min.css ([311927e](https://github.com/CoCreate-app/CoCreate-nginx/commit/311927e51bac46271e89d68182469720b501c66b))

# [1.3.0](https://github.com/CoCreate-app/CoCreate-nginx/compare/v1.2.0...v1.3.0) (2024-01-08)


### Bug Fixes

* improved console.logging ([0b20ad3](https://github.com/CoCreate-app/CoCreate-nginx/commit/0b20ad32f3ca407bb71f5ea14bc623be51a6ba01))
* logging ([f5e18f1](https://github.com/CoCreate-app/CoCreate-nginx/commit/f5e18f1aee274d78fdc624caaffd504a03dab4e6))
* nginx.conf formating ([0c87d43](https://github.com/CoCreate-app/CoCreate-nginx/commit/0c87d43536017668e089629d9894fedbecd0c606))
* removed dev console.log ([fcd5fe0](https://github.com/CoCreate-app/CoCreate-nginx/commit/fcd5fe0dc9fdb9159531ac51f0f7a71363593b02))
* update log message ([36e55af](https://github.com/CoCreate-app/CoCreate-nginx/commit/36e55afe35e9e42a05c5efb19ac3a296882ead0a))


### Features

* bumped CoCreate dependencies to their latest versions ([87643b4](https://github.com/CoCreate-app/CoCreate-nginx/commit/87643b423b1ac62f235bf2599befeb2d38a72b0c))

# [1.2.0](https://github.com/CoCreate-app/CoCreate-nginx/compare/v1.1.5...v1.2.0) (2024-01-03)


### Bug Fixes

* added licencing details ([228d79b](https://github.com/CoCreate-app/CoCreate-nginx/commit/228d79bfb1ca48d5b0eda92dff547304b9df2055))
* update configs ([f6b8788](https://github.com/CoCreate-app/CoCreate-nginx/commit/f6b8788962a34df4aa4e449b0ad6154b9266e2b4))


### Features

* adds stream to handle default 443 ([899089a](https://github.com/CoCreate-app/CoCreate-nginx/commit/899089a74d7c364a65cedcec63d77c48ff886613))
* config nginx to pass https request that have no server block defined to the application, '@cocreate/server' and '@cocreate/acme' will get or create sll and update nginx stream and server block. At this point nginx will handle ssl termination ([d4bbe18](https://github.com/CoCreate-app/CoCreate-nginx/commit/d4bbe185a63b49a53037a89594faead11f849b46))

## [1.1.5](https://github.com/CoCreate-app/CoCreate-nginx/compare/v1.1.4...v1.1.5) (2024-01-01)


### Bug Fixes

* aaded cluster to check if worker == 1 to init once ([bf6c464](https://github.com/CoCreate-app/CoCreate-nginx/commit/bf6c46465fd38290d349ff2c3f0aad0b28de47e0))

## [1.1.4](https://github.com/CoCreate-app/CoCreate-nginx/compare/v1.1.3...v1.1.4) (2024-01-01)


### Bug Fixes

* converted to class ([45b7ea5](https://github.com/CoCreate-app/CoCreate-nginx/commit/45b7ea5bd30381137f979052312b4f53f5f438f9))

## [1.1.3](https://github.com/CoCreate-app/CoCreate-nginx/compare/v1.1.2...v1.1.3) (2024-01-01)


### Bug Fixes

* relocated main nginx config to init ([44c4545](https://github.com/CoCreate-app/CoCreate-nginx/commit/44c454511bf9f1c9ef8a003e5a331aa219116019))

## [1.1.2](https://github.com/CoCreate-app/CoCreate-nginx/compare/v1.1.1...v1.1.2) (2024-01-01)


### Bug Fixes

* removed createServer test ([7a73899](https://github.com/CoCreate-app/CoCreate-nginx/commit/7a738994df49cca8d052bacd62dce476e3c47081))

## [1.1.1](https://github.com/CoCreate-app/CoCreate-nginx/compare/v1.1.0...v1.1.1) (2023-12-31)


### Bug Fixes

* removed createServer test ([d1eae5c](https://github.com/CoCreate-app/CoCreate-nginx/commit/d1eae5cedf02dabd5e4da620866d6999f8be8fbd))

# [1.1.0](https://github.com/CoCreate-app/CoCreate-nginx/compare/v1.0.0...v1.1.0) (2023-12-31)


### Bug Fixes

* newRules ([44ba155](https://github.com/CoCreate-app/CoCreate-nginx/commit/44ba155c711d1f606b71388dacf7d30fdb68a474))
* removed dependencies ([81e9534](https://github.com/CoCreate-app/CoCreate-nginx/commit/81e9534283315901b0099f4e0627718eb3e5ac49))
* update certificate path ([bd290c1](https://github.com/CoCreate-app/CoCreate-nginx/commit/bd290c1c3ab51effb48c7f06c9d098065fd579fd))


### Features

* ability to restrict sudoers after startup and configuration complete ([27b6a30](https://github.com/CoCreate-app/CoCreate-nginx/commit/27b6a302a553250986caf3496f88f4cf07ba3434))
* Checks for nigx installation and installs ([3c4e0e8](https://github.com/CoCreate-app/CoCreate-nginx/commit/3c4e0e841efc9d36ad5c8611bcaab626805feb36))

# 1.0.0 (2023-12-29)


### Features

* Initial Release ([70f50a2](https://github.com/CoCreate-app/CoCreate-nginx/commit/70f50a2b3b801221c8a765f52eded7fb8ff582d5))
