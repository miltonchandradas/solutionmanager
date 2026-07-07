const cds = require('@sap/cds')

module.exports = async (srv) => {
  const remoteService = await cds.connect.to('SALM_TM_TWL_SRV')

  srv.on('READ', 'Defects', async req => {
    req.query.limit(5, 0)
    return remoteService.run(req.query)
  })
}