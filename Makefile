lint: 
	@node ./node_modules/.bin/tslint \"src/**/*.ts\" --project tsconfig.json --type-check
test:
	@node ./node_modules/.bin/lab dist-test/
tsc:
	@node ./node_modules/.bin/tsc -p tsconfig.json
tsc-test:
	@node ./node_modules/.bin/tsc -p tsconfig-test.json
clean:
	@node ./node_modules/.bin/rimraf dist/ && ./node_modules/.bin/rimraf dist-test/
postinstall:
	@node cp -R ./lib/injection-js ./node_modules/injection-js
.PHONY: lint test tsc tsc-test clean postinstall
