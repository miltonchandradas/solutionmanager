const cds = require('@sap/cds')

const REMOTE_COLUMNS = [
  'DefectId',
  'TestPackageId',
  'TestCaseId',
  'ShortText',
  'LongText',
  'Type',
  'StatusValue',
  'StatusText'
]

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

const escapeODataString = value => String(value).replace(/'/g, "''")

const normalizeResult = result => {
  if (Array.isArray(result)) {
    return result
  }

  if (Array.isArray(result?.value)) {
    return result.value
  }

  if (Array.isArray(result?.d?.results)) {
    return result.d.results
  }

  return []
}

const toLocalDefect = defect => ({
  defectId: defect.DefectId,
  testPackageId: defect.TestPackageId,
  testCaseId: defect.TestCaseId,
  shortText: defect.ShortText,
  longText: defect.LongText,
  type: defect.Type,
  statusValue: defect.StatusValue,
  statusText: defect.StatusText
})

module.exports = async (srv) => {
  const remoteService = await cds.connect.to('SALM_TM_TWL_SRV')

  srv.on('READ', 'Defects', async req => {
    const where = req.query.SELECT?.where
    const testPackageId = readFilterValue(where, 'testPackageId')
    const testCaseId = readFilterValue(where, 'testCaseId')
    const defectId = readFilterValue(where, 'defectId')

    if (!testPackageId || !testCaseId) {
      return req.reject(
        400,
        'Defects requires both testPackageId and testCaseId because the backend only supports defect access via TestCaseSet(...)/toDefectSet.'
      )
    }

    const key = `TestCaseId='${escapeODataString(testCaseId)}',TestPackageId='${escapeODataString(testPackageId)}'`
    const queryParts = [`$select=${REMOTE_COLUMNS.join(',')}`]

    if (defectId) {
      queryParts.push(`$filter=DefectId eq '${escapeODataString(defectId)}'`)
    }

    const path = `/TestCaseSet(${key})/toDefectSet?${queryParts.join('&')}`
    const result = await remoteService.send({ method: 'GET', path })
    const mappedDefects = normalizeResult(result).slice(0, 5).map(toLocalDefect)

    if (req.query.SELECT?.one) {
      return mappedDefects[0]
    }

    return mappedDefects
  })
}