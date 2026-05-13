import { Routes } from '@angular/router';
import { Auth } from './components/auth/auth'
import { Feed } from './components/feed/feed';
import { Reg } from './components/reg/reg'
import { CreatePost } from './components/create-post/create-post';
import { Chat } from './components/chat/chat';

export const routes: Routes = [
    { path: '', component: Auth },
    { path: 'auth', component: Auth },
    { path: 'reg', component: Reg},
    { path: 'feed', component: Feed },
    { path: 'create-post', component: CreatePost },
    { path: 'chat', component: Chat}
];
