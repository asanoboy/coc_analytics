update:
	git checkout master
	node ./bin/update_data.js
	git checkout gh_pages
	git add data.json
	git commit -m "Updated json."
	git checkout master

