update:
	node ./bin/update_data.js

update_commit:
	git checkout gh-pages
	git rm data.js --ignore-unmatch
	git commit -m "tmp" --allow-empty
	git checkout master
	node ./bin/update_data.js
	git checkout gh-pages
	git add data.js
	git commit -m "Updated data.js." --amend
	git checkout master

