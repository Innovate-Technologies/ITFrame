import ExtendableError from "~/components/ExtendableError";

export default class AccessDeniedError extends ExtendableError {
    constructor(m) {
        super(m);
    }
}
