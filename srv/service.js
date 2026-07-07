const cds = require('@sap/cds')

module.exports = async (srv) => {
  const remoteService = await cds.connect.to('SALM_TM_TWL_SRV')

  srv.on('READ', 'Defects', async req => {
    const query = { ...req.query, SELECT: { ...req.query.SELECT } }

    delete query.SELECT.limit

    const result = await remoteService.run(query)

    if (!Array.isArray(result)) {
      return result
    }

    return result.slice(0, 5)
  })
}