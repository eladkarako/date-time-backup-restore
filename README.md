a NodeJS program that takes recursive-enumerate all files and folder within a given path,  
you can send a relative or fully qualified path,  
the output is a deep-sorted json.  

the json includes `lstat` result, with few additions.  
both the fully qualified and whatever original (possibly relative) paths are kept.  

this is a partial, first part of a two part project,  
implementating a way to backup and restore file and folders creation, last modified and last access data-time information,  
for example before and after storing in a repository (github) and checking-out the repository,  
the (possibly) relative path data, and the modification date-time is the most useful information,  
I've included the other information just because it is already available..  

the result json (object) is natural deep-sorted since the result can be more easily compared using programs such as BeyondCompare.  

the next part of restoring some of the date and time values would parse the json,  
and apply stored data-time values if it can match the sub-tree.  
this will be a little more complex since nodejs does not handle access/creation/"birth" time very well,  
but at least the modification time is handled somewhat sufficiently well.  
it is also need to support moving of sub-tree or renaming it,  
which in this case relative path name ("original") can be used,  
but if fully qualified path were used, the changed path needs to be adjusted,  
but I might skip this part to avoid bugs that might modify a lot of files by mistake.

<hr/>

use:  `node index.js "."` to recursive-enumerate files and folder in current folder. result json is written to the same folder as the script for now..
