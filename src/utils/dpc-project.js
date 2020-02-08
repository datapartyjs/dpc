const fs = require('fs')
const deepSet = require('deep-set')
const {JSONPath} = require('jsonpath-plus')
const debug = require('debug')('dpc.DpcProject')


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

  get bucket(){
    return this.file.bucket
  }

  get gpgfs(){
    return this.bucket.root
  }

  async getCloudBucket(cloudName){
    const cloudBucket = await this.gpgfs.bucket(`cloud-${cloudName}`)

    await this.touchCloudBucket(cloudBucket)

    return cloudBucket
  }

  getDeployBucket(cloudName, serviceName){
    throw new Error('not implemented')
  }

  get name() { return this.data.name }
  set name(val) { deepSet(this.data, 'name', val) }

  get owners() { return this.data.owner }
  set owners(val) { deepSet(this.data, 'owner', val) }

  getByField(arrPath, field, val){
    const path = `$..${arrPath}[?(@.${field}=="${val[field]}")]`
    const results = JSONPath({path, json:this.data})

    return results[0]
  }

  getByName(arrPath, val){
    const path = `$..${arrPath}[?(@.name=="${val.name}")]`
    const results = JSONPath({path, json:this.data})

    return results[0]
  }

  findInSubList(list, sublist, value){
    const query = `${list}[?(@.${sublist}.indexOf("${value}")>-1)].name`
    const listItemNames = JSONPath({path: query, json: this.data})
    return listItemNames
  }

  async touchCloudBucket(cloudBucket){
    if(!await cloudBucket.exists()){
      debug('touchCloudBucket - creating bucket cloud-' + cloudBucket)
      await cloudBucket.create()
    }
  }

  async touchServiceConfig(cloudBucket, srv){
    debug('touchSrv - ', srv)
    const srvCfgPath = Path.join('srv/', srv, 'config.json')
    const srvCfgFile = await cloudBucket.file(srvCfgPath)

    if(!await srvCfgFile.exists()){
      await cloudBucket.create('{}')
    }
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

  async existsByName(list, devs){
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

    await this.existsByName('developers', newTeam.owner)
    await this.existsByName('developers', newTeam.members)

    this.setByName('teams', newTeam)
  }

  async setPackage(pkg){
    const oldPackage = this.getByName('packages', {
      name: pkg.name
    }) || {}

    debug('oldPackage', oldPackage)

    const newPackage = {
      name: pkg.name,
      path: pkg.path || oldPackage.path,
      type: pkg.type || oldPackage.type,
      build: pkg.build || oldPackage.build,
      artifacts: pkg.artifacts || oldPackage.artifacts
    }

    this.setByName('packages', newPackage)
  }

  async setService(srv){
    const oldService = this.getByName('services', {
      name: srv.name
    }) || {}

    debug('oldService', oldService)

    const newService = {
      name: srv.name,
      packages: packages.path || packages.path,
    }

    this.setByName('services', newService)
  }

  async setCloud(cloud, keyPath){
    const oldCloud = this.getByName('clouds', {
      name: cloud.name
    }) || {}

    debug('oldCloud', oldCloud)

    const apiKeyPath = (cloud.apiKeyPath && cloud.apiKeyPath.length > 1)
      ? cloud.apiKeyPath
      : oldCloud.apiKeyPath

    const newCloud = {
      name: cloud.name,
      team: cloud.team || oldCloud.team,
      type: cloud.type || oldCloud.type,
      apiKeyPath,
      services: uniqueArray([].concat(cloud.services, oldCloud.services))
    }

    await this.existsByName('teams', [newCloud.team])
    await this.existsByName('services', newCloud.services)

    const cloudBucket = await this.getCloudBucket(newCloud.name)

    if(newCloud.services && newCloud.services.length > 0){
      await Promise.all(
        newCloud.services.map(srv => {
          return this.touchServiceConfig(cloudBucket, srv)
        })
      )
    }
    

    if(newCloud.type=='gce' && keyPath){
      debug('setCloud() - storing GCE json')

      const keyText = fs.readFileSync(keyPath)
      const keyJson = JSON.parse(keyText)

      const keyFile = await cloudBucket.file('gce.json')

      if(!await keyFile.exists()){ 
        await keyFile.create(JSON.stringify(keyJson))
      }
      else {
        await keyFile.save(JSON.stringify(keyJson))
      }

      newCloud.apiKeyPath = 'gce.json'

      debug('setCloud() - removing original keyfile')
      fs.unlinkSync(keyPath)
    }

    this.setByName('clouds', newCloud)
  }

  getUserTeams(who){
    debug('getUserTeams', who)
    const ownedTeams = this.findInSubList('teams', 'owner', who)
    const assignedTeams = this.findInSubList('teams', 'members', who)

    debug('\t', 'ownedTeams', ownedTeams)
    debug('\t', 'assignedTeams', assignedTeams)

    const teams = uniqueArray([].concat( 
      ownedTeams, assignedTeams
    ))

    return teams
  }

  getUserClouds(who){
    debug('getUserClouds', who)
    const teams = this.getUserTeams(who)
    const clouds = uniqueArray(
      teams.map(
        val => { 
          debug('\t\t', val)
          return this.getByField('clouds', 'team',{'team': val})
        }
      )
    )

    return clouds
  }

  async initCloud(cloudName){ throw new Error('not implemented') }
  async initCloudService(cloudName, serviceName){ throw new Error('not implemented') }

  async deployCloud(cloudName){ throw new Error('not implemented') }
  async deployCloudService(cloudName, serviceName){ throw new Error('not implemented') }

}

module.exports = DpcProject