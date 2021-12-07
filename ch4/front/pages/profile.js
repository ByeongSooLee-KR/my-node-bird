import React, { useEffect, useState, useCallback } from 'react';
import Router from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import Head from 'next/head';
import axios from 'axios';

import useSWR from 'swr';

import NicknameEditForm from '../components/NicknameEditForm';
import AppLayout from '../components/AppLayout';
import FollowList from '../components/FollowList';
import { LOAD_FOLLOWERS_REQUEST, LOAD_FOLLOWINGS_REQUEST } from '../reducers/user';

const fetcher = (url) => axios.get(url, { withCredentials: true }).then((result) => result.data);

const Profile = () => {
  const dispatch = useDispatch();
  const { me } = useSelector((state) => state.user);
  const [followingsLimit, setFollowingsLimit] = useState(3);
  const [followersLimit, setFollowersLimit] = useState(3);

  const { data: followersData, error: followerError } = useSWR(`http://localhost:3065/user/follwers?limit=${followersLimit}`, fetcher);
  // data,error 둘 다 없으면 로딩중
  const { data: followingsData, error: followingError } = useSWR(`http://localhost:3065/user/follwings?limit=${followingsLimit}`, fetcher);

  useEffect(() => {
    if (!(me && me.id)) {
      Router.push('/');
    }
  }, [me && me.id]);

  const loadMoreFollowings = useCallback(() => {
    setFollowingsLimit((prev) => prev + 3);
  }, []);

  const loadMoreFollowers = useCallback(() => {
    setFollowersLimit((prev) => prev + 3);
  }, []);

  if (!me) {
    return '내 정보 로딩중....';
  }

  if (followerError || followingError) {
    console.error(followerError || followingError);
    return <div>팔로잉/팔로워 로딩 중 에러가 발생합니다</div>;
  }

  // useEffect(() => {
  //   dispatch({
  //     type: LOAD_FOLLOWERS_REQUEST,
  //   });
  //   dispatch({
  //     type: LOAD_FOLLOWINGS_REQUEST,
  //   });
  // }, []);


  if (!me) {
    return null;
  }
  return (
    <AppLayout>
      <Head>
        <title>내 프로필 | NodeBird</title>
      </Head>
      <NicknameEditForm />
      <FollowList
        header="팔로워 목록"
        data={followingsData}
        onClickMore={loadMoreFollowings}
        loading={!followingsData || !followingError}
      />
      <FollowList
        header="팔로잉 목록"
        data={followersData}
        onClickMore={loadMoreFollowers}
        loading={!followersData || !followerError}
      />
    </AppLayout>
  );
};

export default Profile;
