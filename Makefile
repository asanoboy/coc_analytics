update:
	node ./bin/update_data.js

update_commit:
	git checkout gh_pages
	git rm data.json
	git commit -m "tmp"
	git checkout master
	node ./bin/update_data.js
	git checkout gh_pages
	git add data.json
	git commit -m "Updated json." --amend
	git checkout master

