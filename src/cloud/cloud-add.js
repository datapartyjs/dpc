 

const CmdTree = require('command-tree')
const Hoek = require('@hapi/hoek')
const debug = require('debug')('dpc.cloud-add')

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
  g: {
    type: 'string',
    alias: 'gce',
    description: 'GCE keyfile in JSON format'
  },
  t: {
    type: 'string',
    alias: 'team',
    description: 'Managing team'
  },
  s: {
    type: 'string',
    alias: 'service',
    description: 'Service deployed to cloud',
    multiple: true
  }
}

class CloudAdd extends CmdTree.Command {
  constructor(context){
    super({...CloudAdd.Definition, context})
    debug('constructor')
  }
  
  static get Command(){
    return 'cloud add'
  }
  
  static get Definition(){
    return {
      usage: `dpc cloud add [options]`,
      description: 'Initialize cloud',
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

    let type = null
  
    await project.setCloud({
      name: parsed.name,
      team: parsed.team,
      type: !parsed.gce || parsed.gce.length < 1 ? '' : 'gce',
      services: parsed.service
    }, parsed.gce)

    await project.save()
    
    return project.data
  }
}

module.exports = CloudAdd
