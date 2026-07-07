using {solutionmanager as my} from '../db/schema.cds';

@path: '/service/solutionmanager'

service SolutionManagerService {
    entity Defects as projection on my.Defects;
    entity Packages as projection on my.Packages;
}