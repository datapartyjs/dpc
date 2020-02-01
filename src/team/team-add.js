 

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

  async developersExist(project, list, devs){
    for(let dev of devs){
      let d = project.getByName(list, {name: dev})

      if(!d){
        throw new Error(`User [ ${dev} ] doesn\'t exist in list[ ${list} ]`)
      }
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
  
    const oldTeam = project.getByName('teams', {
      name: parsed.name
    }) || {}

    debug('oldTeam', oldTeam)

    const team = {
      name: parsed.name,
      owner: uniqueArray([].concat(parsed.owner, oldTeam.owner)),
      members: uniqueArray([].concat(parsed.member, oldTeam.members))
    }

    await this.developersExist(project, 'developers', team.owner)
    await this.developersExist(project, 'developers', team.members)

    project.setByName('teams', team)
    
    return project.data
  }
}

module.exports = TeamAdd
