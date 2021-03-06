#!/usr/bin/env node

const Pkg = require('../package.json')
const Gpgfs = require('gpgfs')
const debug = require('debug')('dpc')
const CommandTree = require('command-tree').CommandTree

const Validator = require('./utils/validator')


const commandTree = new CommandTree({ usage: 'dataparty-cli <global-options> [command] <command-options>\nVersion: ' + Pkg.version })

commandTree.addCommand(require('./project/project-init'))
commandTree.addCommand(require('./project/project-show'))
commandTree.addCommand(require('./project/project-mount'))
commandTree.addCommand(require('./developer/developer-add'))
commandTree.addCommand(require('./team/team-add'))
commandTree.addCommand(require('./cloud/cloud-add'))
commandTree.addCommand(require('./cloud/cloud-list'))
commandTree.addCommand(require('./package/package-add'))
commandTree.addCommand(require('./service/service-add'))


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
  //process.exit()
})

