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

const toRelativeODataPath = deferredUri => {
  if (!deferredUri) {
    return undefined
  }

  if (deferredUri.startsWith('/')) {
    return deferredUri
  }

  const parsedUrl = new URL(deferredUri)
  return `${parsedUrl.pathname}${parsedUrl.search}`
}

const normalizeResult = result => {
  if (Array.isArray(result)) {
    return result
  }

  if (Array.isArray(result?.results)) {
    return result.results
  }

  if (Array.isArray(result?.value)) {
    return result.value
  }

  if (Array.isArray(result?.data)) {
    return result.data
  }

  if (Array.isArray(result?.data?.results)) {
    return result.data.results
  }

  if (Array.isArray(result?.data?.value)) {
    return result.data.value
  }

  if (Array.isArray(result?.d?.results)) {
    return result.d.results
  }

  if (Array.isArray(result?.data?.d?.results)) {
    return result.data.d.results
  }

  return []
}

const extractExpandedDefects = result => {
  const testCase = result?.d ?? result?.data?.d ?? result?.data ?? result

  if (Array.isArray(testCase?.toDefectSet?.results)) {
    return testCase.toDefectSet.results
  }

  if (Array.isArray(testCase?.toDefectSet)) {
    return testCase.toDefectSet
  }

  if (Array.isArray(testCase?.toDefectSet?.value)) {
    return testCase.toDefectSet.value
  }

  return []
}

const extractDeferredDefectPath = result => {
  const testCase = result?.d ?? result?.data?.d ?? result?.data ?? result
  return toRelativeODataPath(testCase?.toDefectSet?.__deferred?.uri)
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
    const testCasePath = `/TestCaseSet(${key})?$format=json`
    const testCaseResult = await remoteService.send({ method: 'GET', path: testCasePath })
    const deferredDefectPath = extractDeferredDefectPath(testCaseResult)

    if (!deferredDefectPath) {
      return []
    }

    const separator = deferredDefectPath.includes('?') ? '&' : '?'
    const defectPath = `${deferredDefectPath}${separator}$format=json`
    const defectResult = await remoteService.send({ method: 'GET', path: defectPath })
    let defects = normalizeResult(defectResult)

    if (!defects.length) {
      defects = extractExpandedDefects(defectResult)
    }

    if (defectId) {
      defects = defects.filter(defect => defect.DefectId === defectId)
    }

    defects = defects.filter(
      defect => defect.TestPackageId === testPackageId && defect.TestCaseId === testCaseId
    )

    const mappedDefects = defects.slice(0, 5).map(toLocalDefect)

    console.info('Resolved Defects remote call', {
      testCasePath,
      deferredDefectPath,
      rawResultKeys: defectResult && typeof defectResult === 'object' ? Object.keys(defectResult) : [],
      rowCount: defects.length
    })

    if (req.query.SELECT?.one) {
      return mappedDefects[0]
    }

    return mappedDefects
  })
}