const CmdTree = require('command-tree')
const Hoek = require('@hapi/hoek')
const debug = require('debug')('dpc.service-add')

const Project = require('../utils/dpc-project')

const DEFINITION = {
  h: {
    description: 'Show help',
    alias: 'help',
    type: 'help'
  },
  n: {
    alias: 'name',
    description: 'Cloud Name',
    require: true
  },
  p: {
    type: 'string',
    alias: 'package',
    description: 'Package path',
    multiple: true
  }
}

class ServiceAdd extends CmdTree.Command {
  constructor(context){
    super({...ServiceAdd.Definition, context})
    debug('constructor')
  }
  
  static get Command(){
    return 'service add'
  }
  
  static get Definition(){
    return {
      usage: `dpc service add [options]`,
      description: 'Initialize service',
      definition: DEFINITION
    }
  }
  
  async run({parsed}){
    debug('context -', this.context)
    
    if (parsed.h) {
      throw new CmdTree.Error.HelpRequest('help request')
    }

    if (!parsed.name){
      throw new CmdTree.Error.UsageError('no name provided')
    }

    const bucket = await this.context.gpgfs.bucket('dpc')
    
    if(!await bucket.exists()){ await bucket.create() }
    
    const project = new Project(await bucket.file('dataparty.json'))
    await project.open()
  
    await project.setService({
      name: parsed.name,
      packages: parsed.package
    })

    await project.save()
    
    return project.data
  }
}

module.exports = ServiceAdd

