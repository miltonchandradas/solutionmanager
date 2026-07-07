namespace solutionmanager;

using {SALM_TM_TWL_SRV} from '../srv/external/SALM_TM_TWL_SRV';

entity Defects        as 
    projection on SALM_TM_TWL_SRV.DefectListSet {
        key DefectId as defectId,
            TestPackageId as testPackageId,
            TestCaseId as testCaseId,
            ShortText as shortText,
            Type as type,
            StatusValue as statusValue,
            StatusText as statusText,
            PriorityText as priorityText,
            Processor as processor
    }



