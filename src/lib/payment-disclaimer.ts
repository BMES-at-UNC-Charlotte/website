export const PAYMENT_DISCLAIMER_PARAGRAPHS = [
  'This is not an official University of North Carolina at Charlotte ("University") website. This registration and payment portal is administered by a third-party payment processor. The payment processor is responsible for the security and system availability of the payment portal. The University does not endorse, recommend, guarantee, control, or accept responsibility for any product or service made available by the payment processor. The presence of a link to the payment processor\'s website does not imply any affiliation, endorsement, approval, or verification by the University.',
  "You understand that the payment processor's website may contain terms and privacy policies that are different from the University's terms and policies. You should review these provisions to ensure that you understand them, and to determine whether the website is suitable for you. The University does not review, and is not responsible for, these provisions.",
] as const;

export const PAYMENT_DISCLAIMER = PAYMENT_DISCLAIMER_PARAGRAPHS.join("\n\n");
