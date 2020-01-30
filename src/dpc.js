#!/usr/bin/env node


const Gpgfs = require('gpgfs')
const debug = require('debug')('dpc')
const CommandTree = require('command-tree').CommandTree

const Validator = require('./utils/validator')


const commandTree = new CommandTree({usage: 'dataparty-cli <global-options> [command] <command-options>'})

commandTree.addCommand(require('./project/project-init'))


async function main(){

  if(process.argv.length < 3 || process.argv[2] == 'help'){
    console.log(commandTree.getHelp())
    if(process.send){ process.send(commandTree.getHelp()) }
    return
  }
  
  const gpgfs = new Gpgfs()

  await gpgfs.open()
  
  const output = await commandTree.run({context: {gpgfs}})
  
  if(output){
    console.log(output)

    if(process.send){ process.send({output}) }
  }

  process.exit(0)
}

// Run main
main().catch((error) => {
  console.log(error)
  console.error(error.message)
  debug(error)
  console.log(commandTree.getHelp())
  if(process.send){
    process.send({
      error: error,
      output: commandTree.getHelp()
    })
  }
  process.exit()
})

