import { SessionPayload } from './auth';

export function canAccessAdminPanel(user: SessionPayload): boolean {
    return !!user.isAdmin;
}

export function canApproveExpenses(user: SessionPayload): boolean {
    return !!user.canApprove;
}

export function canProcessExpenses(user: SessionPayload): boolean {
    return !!user.canProcess;
}

export function canSubmitExpenses(user: SessionPayload): boolean {
    // Assuming anyone with explicit canSubmit OR any operational role can submit, 
    // but strictly following the flag is safer. User request said:
    // "return user.canSubmit || user.canApprove || user.canProcess || user.isAdmin;"
    return !!(user.canSubmit || user.canApprove || user.canProcess || user.isAdmin);
}
