import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { currentUid } from './auth'; // Импортируем auth store

const ACCOUNTS_KEY = 'ark_tracker_accounts_meta';
const SELECTED_ID_KEY = 'ark_tracker_selected_account_id';

const defaultAccounts = [
    { id: 'main', name: 'Main Account', serverUid: null }
];

function generateId() {
    if (browser && self.crypto && self.crypto.randomUUID) {
        return self.crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function createAccountStore() {
    let initialAccounts = defaultAccounts;
    let initialSelected = 'main';

    if (browser) {
        const storedAccounts = localStorage.getItem(ACCOUNTS_KEY);
        if (storedAccounts) {
            try {
                initialAccounts = JSON.parse(storedAccounts);
            } catch (e) { console.error(e); }
        }

        const storedSelected = localStorage.getItem(SELECTED_ID_KEY);
        if (storedSelected && initialAccounts.find(a => a.id === storedSelected)) {
            initialSelected = storedSelected;
        } else {
            initialSelected = initialAccounts[0]?.id || 'main';
        }
    }

    const accounts = writable(initialAccounts);
    const selectedId = writable(initialSelected);

    const syncAuthStore = (accts, selId) => {
        const currentAcc = accts.find(a => a.id === selId);
        if (currentAcc && currentAcc.serverUid) {
            console.log(`[Accounts] Switching to UID: ${currentAcc.serverUid}`);
            currentUid.set(currentAcc.serverUid);
            if (browser) localStorage.setItem("user_uid", currentAcc.serverUid);
            console.log(`[Accounts] No Server UID for this account.`);
            currentUid.set(null); 
        }
    };

    if (browser) {
        accounts.subscribe(val => {
            localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(val));
            syncAuthStore(val, get(selectedId));
        });

        selectedId.subscribe(val => {
            localStorage.setItem(SELECTED_ID_KEY, val);
            syncAuthStore(get(accounts), val);
        });
    }

    return {
        accounts,
        selectedId,

        addAccount: (uid, nickname, serverId = null) => {
            const effectiveServerId = serverId || '3';
            
            accounts.update(list => {
                let finalUid = uid;
                let finalName = nickname;

                if (!finalUid) {
                    finalUid = generateId();
                    finalName = `Account ${maxNum + 1}`;
                }

                const existingIndex = list.findIndex(a => a.id === finalUid);
                let newList;

                if (existingIndex >= 0) {
                    newList = [...list];
                    const currentServer = serverId ? effectiveServerId : (newList[existingIndex].serverId || '3');
                    
                    newList[existingIndex] = { 
                        ...newList[existingIndex], 
                        name: finalName, 
                        serverId: currentServer
                    };
                } else {
                    newList = [...list, { 
                        id: finalUid, 
                        name: finalName, 
                        serverId: effectiveServerId,
                        serverUid: uid 
                    }];
                }

                selectedId.set(finalUid);
                return newList;
            });
        },

        deleteAccount: (idToDelete) => {
            const currentList = get(accounts);
            if (currentList.length <= 1) return;

            if (browser) {
                localStorage.removeItem(`ark_tracker_data_${idToDelete}`);
            }

            const newList = currentList.filter(a => a.id !== idToDelete);
            accounts.set(newList);

            const currentSelected = get(selectedId);
            if (currentSelected === idToDelete) {
                selectedId.set(newList[0].id);
            }
        },

        selectAccount: (id) => {
            selectedId.set(id);
        },
        
        setServerUid: (serverUid) => {
            const currentSelected = get(selectedId);
            console.log(`[Accounts] Linking UID ${serverUid} to Account ${currentSelected}`);
            
            accounts.update(list => {
                return list.map(acc => {
                    if (acc.id === currentSelected) {
                        return { ...acc, serverUid: serverUid };
                    }
                    return acc;
                });
            });
        },

        clearCurrentData: () => {
             const current = get(selectedId);
             if (browser && current) {
                 localStorage.removeItem(`ark_tracker_data_${current}`);
                 window.dispatchEvent(new CustomEvent('ark_tracker_clear_data', { detail: { id: current } }));
             }
        }
    };
}

export const accountStore = createAccountStore();