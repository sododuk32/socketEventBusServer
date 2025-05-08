import { GetServerSidePropsResult, GetServerSidePropsContext } from 'next';
export type GSSP = (
  context: GetServerSidePropsContext
) => Promise<GetServerSidePropsResult<{ data: string }>>;
