export interface ChangeObject<ValueT> {
    value: ValueT;
    added: boolean;
    removed: boolean;
    count: number;
}
