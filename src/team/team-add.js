 

const CmdTree = require('command-tree')
const Hoek = require('@hapi/hoek')
const debug = require('debug')('dpc.team-add')

const Project = require('../utils/dpc-project')

const DEFINITION = {
  h: {
    description: 'Show help',
    alias: 'help',
    type: 'help'
  },
  n: {
    alias: 'name',
    description: 'Team Name',
    require: true
  },
  o: {
    alias: 'owner',
    description: 'Team owner',
    multiple: true
  },
  m: {
    alias: 'member',
    description: 'Team member',
    multiple: true
  }
}

class TeamAdd extends CmdTree.Command {
  constructor(context){
    super({...TeamAdd.Definition, context})
    debug('constructor')
  }
  
  static get Command(){
    return 'team add'
  }
  
  static get Definition(){
    return {
      usage: `dpc team add [options]`,
      description: 'Initialize team',
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
  
    await project.setTeam({
      name: parsed.name,
      owner: parsed.owner,
      members: parsed.member
    })

    await project.save()
    
    return project.data
  }
}

module.exports = TeamAdd
