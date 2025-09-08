package com.smhrd.buildUp.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.smhrd.buildUp.dto.Member;

@Mapper
public interface MemberMapper {
    int insert(Member member);
    Member findByEmail(@Param("email") String email);
}

