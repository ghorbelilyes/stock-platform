import { Routes } from '@angular/router';
import { Documentation } from '../reference/demos/documentation/documentation';
import { Crud } from '../reference/demos/crud/crud';
import { Empty } from '../reference/demos/empty/empty';

export default [
    { path: 'documentation', component: Documentation },
    { path: 'crud', component: Crud },
    { path: 'empty', component: Empty },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
