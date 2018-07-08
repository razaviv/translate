#!/usr/bin/env node
var program = require('commander');
var { prompt } = require('inquirer');
var fs = require('fs');
var request = require('request');
var shell = require('shelljs');

program
  .version('1.0.0');

const add_questions = [
  {
    type: "input",
    name: "key",
    message: "Enter key in english:"
  },
  {
    type: "input",
    name: "value",
    message: "Enter value in in desired language:"
  },
  {
    type: "input",
    name: "locale",
    message: "Enter locale (ex: en-US) or leave blank for default (he-IL):"
  }
];

program
  .command("add")
  .description("Add a translation")
  .action(() => {
    prompt(add_questions).then(answers => {
      try {
        validateParams(answers);
      }
      catch(err) { console.log(err); }
    });
  })

  program.parse(process.argv);

  function validateParams(answers) {
    try {
      var result = {};
      result.key = answers.key;
      result.value = answers.value;
      result.force = false;
      result.locale = answers.locale;
      if (!result.key) throw "key is missing";
      if (!result.locale) result.locale = "he-IL";
      return getAllDirs(result);
    }
    catch(err) { console.log(err); }
  }

  function getAllDirs(result) {
    try {
      fs.readdir("app/locales", (err, dirs) => {
        if (dirs.length>0)
        {
          result.dirs = dirs;
          if (result.dirs[0]==".DS_Store") result.dirs.shift();
          return addTranslates(result);
        }
        throw "No locales found!";
      });
    }
    catch(err) { console.log(err); }
  }

  function addTranslates(result) {
    try {
      let num = 0;
      Promise.all(
        result.dirs.map(function(dir) {
          return new Promise(function(resolve, reject) {

            fs.readFile("app/locales/" + dir + "/translations.json", (err, data) => {
              data = data.toString();
              data = JSON.parse(data);
              if (result.key in data && !result.force)
                resolve({dir: dir, status: "failed", message: "exists"});
              else {
                if (result.locale==dir) {
                  data[result.key] = result.value;
                }
                if (dir=="en-US" && result.locale!="en-US") {
                  data[result.key] = result.key;
                }
                if (dir!="en-US" && result.locale!=dir) {
                  data[result.key] = "";
                }
                data = JSON.stringify(data, null, 2);
                fs.writeFile("app/locales/" + dir + "/translations.json", data, function (err) {
                  if (err) resolve({dir: dir, status: "failed", message: err});
                  else resolve({dir: dir, status: "success"});
                });
              }
            });
          });
        })
      ).then(finished => {
        console.log(finished);
      });
    }
    catch(err) { console.log(err); }
  }
