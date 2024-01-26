const fs = require('fs')
const exec = require('child_process').exec

fs.readdir('./', { encoding: 'utf-8'}, (error, file_list) => {
  if(error) return
  let ejs_list = file_list.filter(file => file.endsWith('.ejs'))
  ejs_list.forEach(ejs => {
    exec(`ejs ${ejs} -o ../public/${ejs.replace('.ejs', '')}.html`, (error, ret) => {
      if(error) console.error(error)
    })
  })
})