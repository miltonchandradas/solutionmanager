namespace solutionmanager;

using {SALM_TM_TWL_SRV} from '../srv/external/SALM_TM_TWL_SRV';

entity Defects  as
    projection on SALM_TM_TWL_SRV.DefectSet {
        key DefectId      as defectId,
            TestPackageId as testPackageId,
            TestCaseId    as testCaseId,
            ShortText     as shortText,
            LongText      as longText,
            Type          as type,
            StatusValue   as statusValue,
            StatusText    as statusText
    }


entity Packages as
    projection on SALM_TM_TWL_SRV.TestPackageSet {
        key TestPackageId          as testPackageId,
            TestPackageName        as name,
            TestPackageTitle       as title,
            TestPackageResponsible as contact,
            PlanPlannedEndDate     as endDate,
            PlanPlannedStartDate   as startDate,

    }
