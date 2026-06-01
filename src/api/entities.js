import { createEntity } from './entityService';
import { auth } from './auth';

export const ForumPost = createEntity('forum_posts');
export const Doctor = createEntity('doctors');
export const Appointment = createEntity('appointments');
export const Article = createEntity('articles');
export const MotherChat = createEntity('mother_chat_messages');
export const Project = createEntity('projects');
export const ChatMessage = createEntity('chat_messages');
export const ProjectFile = createEntity('project_files');
export const Subscription = createEntity('subscriptions');
export const Team = createEntity('teams');

export const User = auth;
