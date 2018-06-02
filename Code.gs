//Google apps script documention https://developers.google.com/apps-script/guides/docs
//a function that appends to the document
/*parameters:
id: of the google document (string)
message: text to append to document (string)
*/
function append(parameters) {
  var id = parameters[0];
  var message = parameters[1]
  //create a document object using the id
  var document = DocumentApp.openById(id);
  //get the body and append text to it
  var body = document.getBody();
  body.appendParagraph(message);
  //return the appended text to the discord bot
  return "appended " + message;
}
//creates format for daily entry section of the engineering journal
/*parameters:
id: of the document (string)
setLocation: whether to look for the heading1 START JOURNAL (boolean)
*/
function createentryformat(parameters){
  var id = parameters[0];
  var setlocation = parameters[1]; //a boolean
  var document = DocumentApp.openById(id);
  var body =document.getBody();
  //if the loction is set, search for it and add text
  if(setlocation){
    //search for START JOURNAL which is a heading1
    //the following variables and while loop are extended from the findElement() documentation [https://developers.google.com/apps-script/reference/document/body]
    var searchType = DocumentApp.ElementType.PARAGRAPH;
    var searchHeading = DocumentApp.ParagraphHeading.HEADING1;
    var searchResult = null;
    while(searchResult = body.findElement(searchType, searchResult)){
      var paragraph = searchResult.getElement().asParagraph();
      if(paragraph.getHeading() == searchHeading && paragraph.getText() == "START JOURNAL"){
        paragraph.setText("START OF DAILY ENTRIES");
        var paragraph2 = body.insertParagraph(body.getChildIndex(paragraph)+1, "END OF DAILY ENTRIES");
        paragraph2.setHeading(DocumentApp.ParagraphHeading.HEADING1);
      }
    }
  }else{
    //if the location is not set, create the start and end at the end of the document. Set each paragraph as a heading1 additionally
    var paragraph = body.appendParagraph("START OF DAILY ENTRIES");
    paragraph.setHeading(DocumentApp.ParagraphHeading.HEADING1);
    var paragraph2 = body.appendParagraph("END OF DAILY ENTRIES");
    paragraph2.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  }
}
//a function for creating a new entry template
/*parameters:
id: id of the document (string)
date: date to create entry for (string)
*/
function newentry(parameters){
  //Manipulating data portion of the algorithm
  var id = parameters[0];
  var date = new Date(parameters[1]); //a string formatted by month/day/year or another format created by a javascript Date object
  //format teh date into mm/dd/yyyy form
  var textDate = (date.getMonth()+1) + "/" + date.getDate() + "/" + date.getFullYear();
  //obtain document, body, and an array of all tables in the document
  var document = DocumentApp.openById(id);
  var body =document.getBody();
  var tables = body.getTables();
  //stores the previous table, datatype of this variable may change to a Table object
  //previous is equal to end or start if the location of the table is at the end or start of the document
  var previous = "end";
  //number of spaces to skip before inserting a template, depends if in between other tables, start, or end
  var increment = 2;
  //used to store if the table for the given date is already created, won't create a new table if one already exists
  var exists = false;
  //2d array containing the format and contents of the first table
   var tableFormat1 = [
    [textDate+"-1","Members Present","General Summary"],
    ["Summary", "", ""]
  ];
  //2d array containing the format and contents of the second table
  var tableFormat2 = [
    [textDate+"-2", "Tasks to work on", "Reflection"],
    ["Brainstorming", "", ""],
    ["Design", "", ""],
    ["Building", "", ""],
    ["Management", "", ""]
  ];


  //first main algorithm: Iterating over tables and finding a table for the current day
  tables.forEach(function(table,index){
    //determine the date associated with the table
    var tableDate= table.getCell(0,0).getText();
    //determine if it's the 1st or 2nd table in an entry (tableFormat1 or tableFormat2)
    var tableNumber = tableDate.slice(tableDate.indexOf('-')+1);
    //exact the date and create a date object
    tableDate = tableDate.slice(0,tableDate.indexOf('-'));
    tableDate = new Date(tableDate);
    //check for second table, so the table is inserted at the end of the daily entries
    if(tableNumber == "2"){
      //this if statement handles the case when this entry should go before the first previous entry
      if(index == 1 && tableDate > date){
        previous = "start";
      }
      //set exists to true if the same date is found
      if(tableDate.toDateString() === date.toDateString()){
        exists = true;
      }
      //set previous to be equal the current table if the current table should appear after it
      if(tableDate < date){
        previous = table;
      }
    }
  });


  //Second algorithm: creating entry in the correct location portion of the algorithm
  //if entry doesn't exist, proceed to create an entry in the known place
  if(!exists){
    //if the template should be inserted at the end of the entries, find the END OF DAILY ENTRIES HEADING and set previous equal to it
    if(previous == "end"){
      var paragraphs = body.getParagraphs();
      paragraphs.forEach(function(paragraph){
        if(paragraph.getHeading() == DocumentApp.ParagraphHeading.HEADING1
           && paragraph.getText() == "END OF DAILY ENTRIES"){
          previous = paragraph;
        }
      });
      increment = 0;
    }
    //if the template should be inserted at the start of the entries, find the START OF DAILY ENTRIES HEADING and set previous equal to it
    else if(previous == "start"){
      var paragraphs = body.getParagraphs();
      paragraphs.forEach(function(paragraph){
        if(paragraph.getHeading() == DocumentApp.ParagraphHeading.HEADING1
           && paragraph.getText() == "START OF DAILY ENTRIES"){
          previous = paragraph;
        }
      });
      increment = 1;
    }
    //insert title of the entry after previous with the correct increment value and make it a heading2
    var title = body.insertParagraph(body.getChildIndex(previous)+increment, textDate + " Entry");
    title.setHeading(DocumentApp.ParagraphHeading.HEADING2);
    //insert tables after the title and add a page break at the end of the entry. Return the result to discord.
    var table1 = body.insertTable(body.getChildIndex(title)+1, tableFormat1);
    var table2 = body.insertTable(body.getChildIndex(table1)+1, tableFormat2);
    body.insertPageBreak(body.getChildIndex(table2)+1);
    return "entry created for " + textDate;
  }else{
    return "entry already created for given date";
  }
}
//a function that adds information to a daily entry template
/*parameters:
id: document id (string)
date: the date of the entry to add information to (string)
category: the category of the entry to add information to (string)
section: the section of the entry to add information to (string)
info: the information to add (string)
*/
function addinformation(parameters){
  var id = parameters[0];
  var date = new Date(parameters[1]); //a string formatted by month/day/year or another format created by a javascript Date object
  var category = parameters[2];
  var section = parameters[3];
  var info = parameters[4];
  var textDate = (date.getMonth()+1) + "/" + date.getDate() + "/" + date.getFullYear();
  var document = DocumentApp.openById(id);
  var body =document.getBody();
  var tables = body.getTables();
  //used for storing the two tables for the day to add to
  var entry = [null,null];
  //find the tables
  tables.forEach(function(table){
    //get the date and number of the current table
    var tableDate= table.getCell(0,0).getText();
    var tableNumber = Number(tableDate.slice(tableDate.indexOf('-')+1));
    tableDate = tableDate.slice(0,tableDate.indexOf('-'));
    tableDate = new Date(tableDate);
    //if it's the correct date, set the coressponding table in entry to be equal to table
    if(tableDate.toDateString() === date.toDateString()){
      entry[tableNumber - 1] = table;
    2
  });
  //exit function if both tables are not found
  if(entry[0] == null || entry[1] == null){
    return "entry not found";
  }
  //obtain the row, col and table to insert to depending on the category and section
  var rowIndex = null;
  var colIndex = null;
  var tableIndex = null;
  var categories = ["brainstorming", "design", "building", "management"];
  if(categories.indexOf(category) >= 0){
    //set the row/col indexes to the correct location
    if(section == "tasks"){
      colIndex = 1;
    }else if(section == "reflection"){
      colIndex = 2;
    }
    tableIndex = 1;
    rowIndex = categories.indexOf(category) + 1;
  }
  //the summary category is located in the first table, so determining the index in this case is seperate
  else if(category == "summary"){
    if(section == "members"){
      colIndex = 1;
    }else if(section == "general"){
      colIndex = 2;
    }
    rowIndex = 1;
    tableIndex = 0;
  }
  //append the information as a list item once the cell is found
  entry[tableIndex].getCell(rowIndex, colIndex).appendListItem(info);
  return ("information added to " + category + "-" + section + " of " + textDate);
}
//function used for testing other functions directly through apps script
function testCall(){
  //createentryformat(["1JLdd8Fq5CMNNVubOf9kVk_GCQNmwKY9Wf4-XSvJqzLw",true]);
  //newentry(["1JLdd8Fq5CMNNVubOf9kVk_GCQNmwKY9Wf4-XSvJqzLw","1/10/2017"]);
}
