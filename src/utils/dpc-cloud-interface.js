class DpcCloudInterface {
  constructor({cloud, project, storage}){
    this.cloud = cloud
    this.project = project
    this.storage = storage
  }

  async createServiceInstance(service, options){ 
    throw new Error('not implemented')
  }

  async createServiceImage(serviceName, options){
    throw new Error('not implemented')
  }

  async createServiceCluster(serviceName, options){
    throw new Error('not implemented')
  }
}