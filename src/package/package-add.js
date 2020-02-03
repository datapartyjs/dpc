const CmdTree = require('command-tree')
const Hoek = require('@hapi/hoek')
const debug = require('debug')('dpc.package-add')

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
    alias: 'path',
    description: 'Package path'
  },
  t: {
    type: 'string',
    alias: 'type',
    description: 'Package type (npm, yarn, snapcraft)'
  },
  b: {
    type: 'string',
    alias: 'build',
    description: 'Build command',
    multiple: true
  }
}

class PackageAdd extends CmdTree.Command {
  constructor(context){
    super({...PackageAdd.Definition, context})
    debug('constructor')
  }
  
  static get Command(){
    return 'package add'
  }
  
  static get Definition(){
    return {
      usage: `dpc package add [options]`,
      description: 'Initialize source package',
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
  
    await project.setPackage({
      name: parsed.name,
      path: parsed.path,
      type: parsed.type,
      build: parsed.build
    })

    await project.save()
    
    return project.data
  }
}

module.exports = PackageAdd
