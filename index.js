"use strict";


function natural_compare(a,b){
  let ax=[]
     ,bx=[]
     ;
  if("function" === typeof natural_compare.extraction_rule){
   a = natural_compare.extraction_rule(a);
   b = natural_compare.extraction_rule(b);
  }
  //numbers can be normalized (original value is fine, - it is just another kind of extraction-rule.
  a = ("number" === typeof a) ? String(a) : a;  
  b = ("number" === typeof b) ? String(b) : b;

  //but not much else..
  if("string" !== typeof a){return 0;}
  if("string" !== typeof b){return 0;}

  a.replace(/(\d+)|(\D+)/g,function(_,$1,$2){ ax.push([$1 || Infinity, $2 || ""]); });
  b.replace(/(\d+)|(\D+)/g,function(_,$1,$2){ bx.push([$1 || Infinity, $2 || ""]); });
  while(ax.length>0 && bx.length>0){
   let an = ax.shift()
      ,bn = bx.shift()
      ,nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1])
      ;
   if(0 !== nn){ return nn; }
  }
  return (ax.length - bx.length);
};


function recursive_sort(o){
  if("object"    !== typeof o 
  || "undefined" === typeof o.constructor
  || "undefined" === typeof o.constructor.name){
    return o; 
  }
  
  if("array"  !== o.constructor.name.toLowerCase()
  && "object" !== o.constructor.name.toLowerCase()){ 
    return o; 
  }

  if("array"  === o.constructor.name.toLowerCase()){
    //------------------------------------------------------ unique
    let unique             = new Object(null)  
       ,items_non_key_like = []                
       ;
    o.forEach((item) => { 
      if("string" === typeof item){
        unique[ item ] = 123; 
      }else if("number" === typeof item){
        unique[ String(item) ] = 123; 
      }else{
        items_non_key_like.push(item);
      }
    });
    unique = Object.keys(unique); 
    o = [].concat(unique, items_non_key_like);
    //------------------------------------------------------ unique (done)
    
    o = o.map((item) => {
          return recursive_sort(item);
        });
    
    o = o.sort(natural_compare);
    return o;
  }
  
  if("object"  === o.constructor.name.toLowerCase()){
    Object.keys(o)
          .forEach((key) => {
            o[key] = recursive_sort( o[key] );
          });
    const tmp = (new Object(null));
    Object.keys(o)
          .sort(natural_compare)
          .forEach((key) => {
            tmp[key] = o[key];  
          })
    o = tmp;
    return o;
  }
}

const PATH               = require("path")
     ,regexps            = {foo              : ""                 //re-used regular-expressions
                           ,weird_file_names : /[\"\0\r\n\t]+/gm
                           ,any_slash        : /[\/\\]+/g
                           ,slash_at_end     : /\/+$/g
                           ,slash_then_node  : /[\/\\]node/i
                           }
     ;

regexps.slash_then_main_module = (new RegExp(
                        "\[\\\/\\\\\]"                                                            //it is [\/\\] - but escaped.
                      + process.mainModule.filename.replace(regexps.any_slash,"/").split("/").pop()
                      ,
                      "i")
                      );

const resolve_path       = function(input){
                             input = input.replace(regexps.weird_file_names,""); //glitches in Windows CMD.
                             input = input.replace(regexps.any_slash,"/");       //normalize \ to / (still works in Windows).
                             input = PATH.resolve(input);                        //fully qualified path.
                             input = input.replace(regexps.any_slash,"/");       //normalize \ to / again.
                             input = input.replace(regexps.slash_at_end,"");     //remove last '/' for folder paths.
                             return input;
                           }
     ,is_node_or_module  = function(s){
                             return (regexps.slash_then_node.test(s) 
                                  || regexps.slash_then_main_module.test(s)); }
     ,args               = process.argv
                                  .map(   (arg) => (arg.replace(regexps.weird_file_names,"").trim()        ) )                      //CMD quirks
                                  .filter((arg) => ((arg.length > 0) && (false === is_node_or_module(arg)) ) )
     ,ARGS_DELIMITER     = "####"                                                       //something that would probably never be a part of a real file-name or path...  similar to how arguments are sent to programs from the shell with \0
     ,args_str           = ARGS_DELIMITER + args.join(ARGS_DELIMITER) + ARGS_DELIMITER  //helps you search the arguments as a long string.
     ,NEWLINE            = require("os").EOL
     ;

const FS                 = require("fs")
     ,is_access          = function(path){
                             try{
                               FS.accessSync(path, (FS.R_OK || FS.constants.R_OK));
                               return true;
                             }catch(err){
                               return false;
                             }
                           }
     ,read_dir           = FS.readdirSync.bind(FS)
     ,stats              = FS.lstatSync.bind(FS)
     ,write_file         = function(path, content){
                             FS.writeFileSync(path, content, {flag:"w", encoding:"utf8"});
                           }
     ;

let  files_and_folders   = new Object(null)
     ;


function beautify(o){
  return JSON.stringify(o, null, 2)        //built-in beautifier (null for unused additional process-function, 2 for two whitespace).
             .replace(/[\r\n]+/gm, "\n")   //normalize to Linux EOL, for the sake of next regular-expression .
             .replace(/,\n /g, "\n ,")     //put ',' in the next line (the other side of the \r\n) .
             .replace(/ *(,( +))/g,"$2,")  //preserve the whitespace before ',' .
             .replace(/\n+/gm, NEWLINE)    //normalize to Windows EOL.
             ;
}



//---------------------------------------------------------------------------------------------------------------

function enumerate(path){
  const fully_qualified_path = resolve_path(path);
  
  if(false === is_access(fully_qualified_path)){return;}      //both "is exists" and "is has access" (or permission).
  
  const stats_for_path       = stats( fully_qualified_path );

  stats_for_path.path_parts                      = PATH.parse(fully_qualified_path); //add values to object.
  stats_for_path.path_parts.fully_qualified_path = fully_qualified_path;             //add value  to object. missing in of parts.
  stats_for_path.path_parts.original_value       = path;                             //preserve whatever entered by user, helps to re-use data when folder would be moved or renamed, since it might be relative.
  
  stats_for_path.is_directory                    = stats_for_path.isDirectory();     //add value  to object.
  stats_for_path.is_file                         = stats_for_path.isFile();          //add value  to object.
  stats_for_path.is_symbolic_link                = stats_for_path.isSymbolicLink();  //add value  to object.
  
  files_and_folders[ path ] = stats_for_path;                            //store.
  
  if(true === stats_for_path.is_directory){
    read_dir(fully_qualified_path, {encoding:"utf8"}).forEach((sub_path) => {
                                                        sub_path = path + "\/" + sub_path;
                                                        enumerate(sub_path);
                                                      });
  }
}


args.forEach((arg) => {

  enumerate(arg);

})


files_and_folders = recursive_sort(files_and_folders); //result will be more unified and easier to compare.

write_file( resolve_path("./result.json"), beautify(files_and_folders) );

