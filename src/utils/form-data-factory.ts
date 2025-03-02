export class FormDataFactory {
  public readonly formData: FormData;

  constructor(formData: FormData) {
    this.formData = formData;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static fromObject(data: Record<any, any>): FormDataFactory {
    const formData = new FormData();

    for (const [key, value] of Object.entries(data)) {
      formData.append(key, value);
    }

    return new FormDataFactory(formData);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toObject(): Record<any, any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fields: Record<any, any> = {};
    for (const key of Object.keys(this.formData)) {
      fields[key] = this.formData.get(key)?.toString();
    }

    return fields;
  }
}
