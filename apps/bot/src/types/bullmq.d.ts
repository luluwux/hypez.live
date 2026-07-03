declare module 'bullmq' {
    export class Queue {
        constructor(name: string, opts?: any);
        add(name: string, data: any, opts?: any): Promise<any>;
    }
    
    export class Worker {
        constructor(name: string, processor: (job: any) => Promise<any>, opts?: any);
        on(event: string, listener: (...args: any[]) => void): this;
    }
}
