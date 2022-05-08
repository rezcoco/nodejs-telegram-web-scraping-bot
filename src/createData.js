const fs = require('fs')
const dirPath = './data.json'

const writeData = data => {
  const { name, link } = data

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
    fs.writeFile(dirPath, '[]', err => {
      if (err) console.log(err)
    })
  } else {
     fs.readFile(dirPath, 'utf-8', (err, data) => {
     if (err) console.log(err)
  
     const scrapedData = { name, link }
     const readed = JSON.parse(data)
  
     // check duplicate data
     for (let i = 0; i < readed.length; i++) {
       if (name === readed[i].name) {
         console.log('data already written')
         get(readed)
         return
       }
     }
     // added to json
     readed.push(scrapedData)
  
     // write data
     fs.writeFile(dirPath, JSON.stringify(readed), err => {
       if (err) console.log(err)
  
       console.log("Written")
       get(readed)
     })
   })
  }
}

module.exports.writeData = writeData
