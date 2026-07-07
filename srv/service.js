const cds = require('@sap/cds')

const readFilterValue = (where, fieldName) => {
  if (!Array.isArray(where)) {
    return undefined
  }

  for (let index = 0; index < where.length - 2; index += 1) {
    const left = where[index]
    const operator = where[index + 1]
    const right = where[index + 2]

    if (left?.ref?.[left.ref.length - 1] !== fieldName || operator !== '=') {
      continue
    }

    if (right && Object.prototype.hasOwnProperty.call(right, 'val')) {
      return right.val
    }
  }

  return undefined
}

module.exports = async (srv) => {
  const remoteService = await cds.connect.to('SALM_TM_TWL_SRV')

  srv.on('READ', 'Defects', async req => {
    const where = req.query.SELECT?.where
    const testPackageId = readFilterValue(where, 'testPackageId')
    const testCaseId = readFilterValue(where, 'testCaseId')
    const defectId = readFilterValue(where, 'defectId')

    if (!testPackageId && !testCaseId && !defectId) {
      return req.reject(400, 'Defects requires at least one filter: defectId, testPackageId, or testCaseId.')
    }

    const query = { ...req.query, SELECT: { ...req.query.SELECT } }

    delete query.SELECT.limit

    const result = await remoteService.run(query)

    if (!Array.isArray(result)) {
      return result
    }

    return result.slice(0, 5)
  })
}