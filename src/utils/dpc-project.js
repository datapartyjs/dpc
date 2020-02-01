const debug = require('debug')('dpc.DpcProject')
const deepSet = require('deep-set')
const {JSONPath} = require('jsonpath-plus')

const Utils = require('./utils')
const uniqueArray = Utils.uniqueArray

const Validator = require('./validator')
const validator = new Validator()

const jsonPointerToPath = (path)=>{
  let newVal = path.replace(/\//g,'.')
      
  if(newVal[0]=='.'){ newVal = newVal.slice(1) }
  return newVal
}

class DpcProject {
  constructor(file){
    this.file = file
    this.data = { 
      created: (new Date()).toISOString()
    }
  }

  get name() { return this.data.name }
  set name(val) { deepSet(this.data, 'name', val) }

  get owners() { return this.data.owner }
  set owners(val) { deepSet(this.data, 'owner', val) }

  getByName(arrPath, val){
    const path = `$..${arrPath}[?(@.name=="${val.name}")]`
    const results = JSONPath({path, json:this.data})

    return results[0]
  }

  setByName(arrPath, val){
    const path = `$..${arrPath}[?(@.name=="${val.name}")]`
    const paths = JSONPath({path, json:this.data, resultType: 'pointer'}).map(jsonPointerToPath)

    if(paths.length > 1){
      debug('setByName - ERROR', arrPath, val, 'non-unique')
      throw new Error('non-unique object name')
    }

    if(paths.length == 1){
      debug('setByName - update', arrPath, val)

      debug('paths', paths[0])

      deepSet(this.data, paths[0], val)
    }
    else{
      if(!this.data[arrPath]){ this.data[arrPath] = [] }

      debug('setByName - create', arrPath, val)
      this.data[arrPath].push(val)
    }
  }

  async exists(){
    return await this.file.exists()
  }
  
  async init(){
    debug('init')
    if(!await this.exists()){
      await this.save()
    }

    return await this.open()
  }
  
  async open(){
    debug('open')
    const content = await this.file.read()
    const obj = JSON.parse(content)
    this.data = await validator.validate('project', obj)
  }

  async save(){
    debug('save')
    const content = await validator.validate('project', this.data)
    const jsonContent = JSON.stringify(content,null,2)

    if(!await this.exists()){
      return await this.file.create(jsonContent)
    }
    else{
      return await this.file.save(jsonContent)
    }
  }

  async developersExist(list, devs){
    for(let dev of devs){
      let d = this.getByName(list, {name: dev})

      if(!d){
        throw new Error(`User [ ${dev} ] doesn\'t exist in list[ ${list} ]`)
      }
    }
  }

  async setDeveloper(dev){
    const oldDeveloper = this.getByName('developers', {
      name: dev.name
    }) || {}

    debug('oldDeveloper', oldDeveloper)

    const developer = {
      name: dev.name,
      email: uniqueArray([].concat(dev.email, oldDeveloper.email)),
      github: uniqueArray([].concat(dev.github, oldDeveloper.github)),
      discord: uniqueArray([].concat(dev.discord, oldDeveloper.discord)),
      keygrip: uniqueArray([].concat(dev.keygrip, oldDeveloper.keygrip)),
    }

    this.setByName('developers', developer)
  }

  async setTeam(team){
    const oldTeam = this.getByName('teams', {
      name: team.name
    }) || {}

    debug('oldTeam', oldTeam)

    const newTeam = {
      name: team.name,
      owner: uniqueArray([].concat(team.owner, oldTeam.owner)),
      members: uniqueArray([].concat(team.members, oldTeam.members))
    }

    await this.developersExist('developers', newTeam.owner)
    await this.developersExist('developers', newTeam.members)

    this.setByName('teams', newTeam)
  }
}

module.exports = DpcProject